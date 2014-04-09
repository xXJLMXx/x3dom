/*
 * X3DOM JavaScript Library
 * http://www.x3dom.org
 *
 * (C)2009 Fraunhofer IGD, Darmstadt, Germany
 * Dual licensed under the MIT and GPL
 */

// ### LOD ###
x3dom.registerNodeType(
    "LOD",
    "Navigation",
    defineClass(x3dom.nodeTypes.X3DLODNode,
        function (ctx) {
            x3dom.nodeTypes.LOD.superClass.call(this, ctx);

            this.addField_MFFloat(ctx, "range", []);

            this._lastRangePos = -1;
        },
        {
            visitChildren: function(transform, drawableCollection, singlePath, invalidateCache, planeMask)
            {
                var i=0, n=this._childNodes.length;

                var vol = this.getVolume();

                var min = x3dom.fields.SFVec3f.MAX();
                var max = x3dom.fields.SFVec3f.MIN();
                vol.getBounds(min, max);

                var mat_view = drawableCollection.viewMatrix;

                var center = new x3dom.fields.SFVec3f(0, 0, 0); // eye
                center = mat_view.inverse().multMatrixPnt(center);

                //var mat_view_model = mat_view.mult(transform);
                this._eye = transform.inverse().multMatrixPnt(center);

                var mid = max.add(min).multiply(0.5).add(this._vf.center);
                var len = mid.subtract(this._eye).length();

                //calculate range check for viewer distance d (with range in local coordinates)
                //N+1 children nodes for N range values (L0, if d < R0, ... Ln-1, if d >= Rn-1)
                while (i < this._vf.range.length && len > this._vf.range[i]) {
                    i++;
                }
                if (i && i >= n) {
                    i = n - 1;
                }
                this._lastRangePos = i;

                var cnode = this._childNodes[i];
                if (n && cnode)
                {
                    var childTransform = this.transformMatrix(transform);
                    cnode.collectDrawableObjects(childTransform, drawableCollection, singlePath, invalidateCache, planeMask);
                }
            },

            getVolume: function()
            {
                var vol = this._graph.volume;

                if (!this.volumeValid() && this._vf.render)
                {
                    var child, childVol;

                    if (this._lastRangePos >= 0) {
                        child = this._childNodes[this._lastRangePos];

                        childVol = (child && child._vf.render === true) ? child.getVolume() : null;

                        if (childVol && childVol.isValid())
                            vol.extendBounds(childVol.min, childVol.max);
                    }
                    else {  // first time we're here
                        for (var i=0, n=this._childNodes.length; i<n; i++)
                        {
                            if (!(child = this._childNodes[i]) || child._vf.render !== true)
                                continue;

                            childVol = child.getVolume();

                            if (childVol && childVol.isValid())
                                vol.extendBounds(childVol.min, childVol.max);
                        }
                    }
                }

                return vol;
            },

            nodeChanged: function() {
                //this._needReRender = true;
                this.invalidateVolume();
                //this.invalidateCache();
            },

            fieldChanged: function(fieldName) {
                //this._needReRender = true;
                if (fieldName == "render" ||
                    fieldName == "center" ||
                    fieldName == "range") {
                    this.invalidateVolume();
                    //this.invalidateCache();
                }
            }
        }
    )
);